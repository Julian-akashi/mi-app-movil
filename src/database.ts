import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export type LocalUser = {
  id: string;
  nombre: string;
  email: string;
  created_at: string;
};

export type NewObject = {
  titulo: string;
  descripcion: string;
  categoria: string;
  tipo_aviso: string;
  facultad: string;
  lugar: string;
  fecha_suceso: string;
  contacto: string;
  imagen_url: string;
  usuario_id: string;
  estado?: string;
};

export type LocalObject = NewObject & {
  id: string;
  estado: string;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  objeto_id: string;
  titulo: string;
  imagen_url: string;
  owner_id: string;
  owner_name: string;
  requester_id: string;
  requester_name: string;
  last_message: string;
  updated_at: string;
  unread_count: number;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type StoredUser = LocalUser & {
  password_hash: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function hashPassword(password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

async function persistImageUri(uri: string, objectId: string) {
  if (!uri || uri.startsWith(Paths.document.uri) || uri.startsWith('http')) {
    return uri;
  }

  const source = new File(uri);
  if (!source.exists) {
    throw new Error('La imagen seleccionada ya no está disponible. Selecciona otra imagen.');
  }

  const extension = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? 'jpg';
  const destination = new File(Paths.document, `objeto-${objectId}.${extension}`);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

async function migrateCachedImages(database: SQLite.SQLiteDatabase) {
  const objects = await database.getAllAsync<{ id: string; imagen_url: string }>(
    "SELECT id, imagen_url FROM objetos WHERE imagen_url != ''"
  );

  for (const object of objects) {
    if (!object.imagen_url.startsWith('file://') || object.imagen_url.startsWith(Paths.document.uri)) {
      continue;
    }

    try {
      const persistedUri = await persistImageUri(object.imagen_url, object.id);
      if (persistedUri !== object.imagen_url) {
        await database.runAsync(
          'UPDATE objetos SET imagen_url = ? WHERE id = ?',
          persistedUri,
          object.id
        );
      }
    } catch {
      await database.runAsync(
        "UPDATE objetos SET imagen_url = '' WHERE id = ? AND imagen_url = ?",
        object.id,
        object.imagen_url
      );
    }
  }
}

async function normalizeCategories(database: SQLite.SQLiteDatabase) {
  await database.runAsync(
    `UPDATE objetos
     SET categoria = CASE categoria
       WHEN 'Credencial' THEN 'Credenciales'
       WHEN 'Electrónica' THEN 'Electrónicos'
       ELSE categoria
     END
     WHERE categoria IN ('Credencial', 'Electrónica')`
  );
}

async function normalizeStatuses(database: SQLite.SQLiteDatabase) {
  await database.runAsync(
    `UPDATE objetos
     SET estado = CASE estado
       WHEN 'recuperado' THEN 'cerrado'
       ELSE estado
     END
     WHERE estado IN ('recuperado')`
  );
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('encuentrafcc.db').then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS usuarios (
          id TEXT PRIMARY KEY NOT NULL,
          nombre TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS objetos (
          id TEXT PRIMARY KEY NOT NULL,
          titulo TEXT NOT NULL,
          descripcion TEXT NOT NULL DEFAULT '',
          categoria TEXT NOT NULL,
          tipo_aviso TEXT NOT NULL DEFAULT 'perdi',
          facultad TEXT NOT NULL DEFAULT '',
          lugar TEXT NOT NULL,
          fecha_suceso TEXT NOT NULL DEFAULT '',
          contacto TEXT NOT NULL DEFAULT '',
          imagen_url TEXT NOT NULL DEFAULT '',
          estado TEXT NOT NULL DEFAULT 'pendiente',
          usuario_id TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS conversaciones (
          id TEXT PRIMARY KEY NOT NULL,
          objeto_id TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          requester_id TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (objeto_id, requester_id),
          FOREIGN KEY (objeto_id) REFERENCES objetos(id),
          FOREIGN KEY (owner_id) REFERENCES usuarios(id),
          FOREIGN KEY (requester_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS mensajes (
          id TEXT PRIMARY KEY NOT NULL,
          conversacion_id TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          recipient_id TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          read_at TEXT,
          FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id),
          FOREIGN KEY (sender_id) REFERENCES usuarios(id),
          FOREIGN KEY (recipient_id) REFERENCES usuarios(id)
        );

      `);

      const migrations = [
        ['tipo_aviso', "ALTER TABLE objetos ADD COLUMN tipo_aviso TEXT NOT NULL DEFAULT 'perdi'"],
        ['facultad', "ALTER TABLE objetos ADD COLUMN facultad TEXT NOT NULL DEFAULT ''"],
        ['fecha_suceso', "ALTER TABLE objetos ADD COLUMN fecha_suceso TEXT NOT NULL DEFAULT ''"],
        ['contacto', "ALTER TABLE objetos ADD COLUMN contacto TEXT NOT NULL DEFAULT ''"],
      ] as const;

      for (const [column, statement] of migrations) {
        try {
          await database.runAsync(statement);
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes(`duplicate column name: ${column}`)) {
            throw error;
          }
        }
      }

      await normalizeCategories(database);
      await normalizeStatuses(database);
      await migrateCachedImages(database);
      return database;
    });
  }

  return databasePromise;
}

export async function registerUser(nombre: string, email: string, password: string) {
  const database = await getDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM usuarios WHERE email = ?',
    normalizedEmail
  );

  if (existingUser) {
    throw new Error('Ya existe una cuenta con ese correo electrónico.');
  }

  const user: LocalUser = {
    id: createId(),
    nombre: nombre.trim(),
    email: normalizedEmail,
    created_at: new Date().toISOString(),
  };

  await database.runAsync(
    `INSERT INTO usuarios (id, nombre, email, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    user.id,
    user.nombre,
    user.email,
    await hashPassword(password),
    user.created_at
  );

  return user;
}

export async function loginUser(email: string, password: string) {
  const database = await getDatabase();
  const user = await database.getFirstAsync<StoredUser>(
    'SELECT id, nombre, email, password_hash, created_at FROM usuarios WHERE email = ?',
    email.trim().toLowerCase()
  );

  if (!user || user.password_hash !== (await hashPassword(password))) {
    throw new Error('El correo o la contraseña son incorrectos.');
  }

  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function initializeDatabase() {
  await getDatabase();
}

export async function createObject(object: NewObject) {
  const database = await getDatabase();
  const id = createId();
  const imagenUri = await persistImageUri(object.imagen_url, id);
  await database.runAsync(
    `INSERT INTO objetos
      (id, titulo, descripcion, categoria, tipo_aviso, facultad, lugar, fecha_suceso, contacto, imagen_url, estado, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    object.titulo.trim(),
    object.descripcion.trim(),
    object.categoria.trim(),
    object.tipo_aviso,
    object.facultad,
    object.lugar.trim(),
    object.fecha_suceso,
    object.contacto.trim(),
    imagenUri,
    object.estado ?? 'pendiente',
    object.usuario_id
  );
}

export async function getObjectById(id: string) {
  const database = await getDatabase();
  return database.getFirstAsync<LocalObject>(
    'SELECT id, titulo, descripcion, categoria, tipo_aviso, facultad, lugar, fecha_suceso, contacto, imagen_url, estado, usuario_id, created_at FROM objetos WHERE id = ?',
    id
  );
}

export async function getOrCreateConversation(objectId: string, requesterId: string) {
  const database = await getDatabase();
  const object = await database.getFirstAsync<{ usuario_id: string | null }>(
    'SELECT usuario_id FROM objetos WHERE id = ?',
    objectId
  );

  if (!object?.usuario_id) {
    throw new Error('El autor de este aviso ya no está disponible.');
  }
  if (object.usuario_id === requesterId) {
    throw new Error('No puedes contactarte a ti mismo desde tu propio aviso.');
  }

  const existing = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM conversaciones WHERE objeto_id = ? AND requester_id = ?',
    objectId,
    requesterId
  );
  if (existing) {
    return existing.id;
  }

  const id = createId();
  await database.runAsync(
    `INSERT INTO conversaciones
      (id, objeto_id, owner_id, requester_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    id,
    objectId,
    object.usuario_id,
    requesterId
  );
  return id;
}

export async function getConversation(conversationId: string, userId: string) {
  const database = await getDatabase();
  return database.getFirstAsync<ConversationSummary>(
    `SELECT c.id, c.objeto_id, o.titulo, o.imagen_url,
            c.owner_id, owner.nombre AS owner_name,
            c.requester_id, requester.nombre AS requester_name,
            COALESCE((SELECT body FROM mensajes WHERE conversacion_id = c.id
                      ORDER BY datetime(created_at) DESC LIMIT 1), '') AS last_message,
            c.updated_at,
            (SELECT COUNT(*) FROM mensajes
             WHERE conversacion_id = c.id AND recipient_id = ? AND read_at IS NULL) AS unread_count
     FROM conversaciones c
     JOIN objetos o ON o.id = c.objeto_id
     JOIN usuarios owner ON owner.id = c.owner_id
     JOIN usuarios requester ON requester.id = c.requester_id
     WHERE c.id = ? AND (c.owner_id = ? OR c.requester_id = ?)`,
    userId,
    conversationId,
    userId,
    userId
  );
}

export async function getConversations(userId: string) {
  const database = await getDatabase();
  return database.getAllAsync<ConversationSummary>(
    `SELECT c.id, c.objeto_id, o.titulo, o.imagen_url,
            c.owner_id, owner.nombre AS owner_name,
            c.requester_id, requester.nombre AS requester_name,
            COALESCE((SELECT body FROM mensajes WHERE conversacion_id = c.id
                      ORDER BY datetime(created_at) DESC LIMIT 1), '') AS last_message,
            c.updated_at,
            (SELECT COUNT(*) FROM mensajes
             WHERE conversacion_id = c.id AND recipient_id = ? AND read_at IS NULL) AS unread_count
     FROM conversaciones c
     JOIN objetos o ON o.id = c.objeto_id
     JOIN usuarios owner ON owner.id = c.owner_id
     JOIN usuarios requester ON requester.id = c.requester_id
     WHERE c.owner_id = ? OR c.requester_id = ?
     ORDER BY datetime(c.updated_at) DESC`,
    userId,
    userId,
    userId
  );
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const database = await getDatabase();
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) {
    throw new Error('No tienes acceso a esta conversación.');
  }

  await database.runAsync(
    `UPDATE mensajes SET read_at = CURRENT_TIMESTAMP
     WHERE conversacion_id = ? AND recipient_id = ? AND read_at IS NULL`,
    conversationId,
    userId
  );

  return database.getAllAsync<ChatMessage>(
    `SELECT m.id, m.conversacion_id AS conversation_id, m.sender_id,
            u.nombre AS sender_name, m.body, m.created_at, m.read_at
     FROM mensajes m
     JOIN usuarios u ON u.id = m.sender_id
     WHERE m.conversacion_id = ?
     ORDER BY datetime(m.created_at) ASC`,
    conversationId
  );
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const database = await getDatabase();
  const conversation = await getConversation(conversationId, senderId);
  if (!conversation) {
    throw new Error('No tienes acceso a esta conversación.');
  }

  const recipientId = conversation.owner_id === senderId
    ? conversation.requester_id
    : conversation.owner_id;
  const message = body.trim();
  if (!message) {
    throw new Error('Escribe un mensaje antes de enviarlo.');
  }

  await database.runAsync(
    `INSERT INTO mensajes
      (id, conversacion_id, sender_id, recipient_id, body, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    createId(),
    conversationId,
    senderId,
    recipientId,
    message
  );
  await database.runAsync(
    'UPDATE conversaciones SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    conversationId
  );
}

export async function updateObject(id: string, userId: string, object: NewObject) {
  const database = await getDatabase();
  const imagenUri = await persistImageUri(object.imagen_url, id);
  const result = await database.runAsync(
    `UPDATE objetos
     SET titulo = ?, descripcion = ?, categoria = ?, tipo_aviso = ?, facultad = ?,
         lugar = ?, fecha_suceso = ?, contacto = ?, imagen_url = ?, estado = ?
     WHERE id = ? AND usuario_id = ?`,
    object.titulo.trim(),
    object.descripcion.trim(),
    object.categoria.trim(),
    object.tipo_aviso,
    object.facultad,
    object.lugar.trim(),
    object.fecha_suceso,
    object.contacto.trim(),
    imagenUri,
    object.estado ?? 'pendiente',
    id,
    userId
  );

  if (result.changes === 0) {
    throw new Error('No tienes permiso para editar este aviso.');
  }
}

export async function deleteObject(id: string, userId: string) {
  const database = await getDatabase();
  const result = await database.runAsync(
    'DELETE FROM objetos WHERE id = ? AND usuario_id = ?',
    id,
    userId
  );

  if (result.changes === 0) {
    throw new Error('No tienes permiso para eliminar este aviso.');
  }
}
