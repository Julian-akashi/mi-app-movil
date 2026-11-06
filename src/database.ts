import * as Crypto from 'expo-crypto';
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
  await database.runAsync(
    `INSERT INTO objetos
      (id, titulo, descripcion, categoria, tipo_aviso, facultad, lugar, fecha_suceso, contacto, imagen_url, estado, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    createId(),
    object.titulo.trim(),
    object.descripcion.trim(),
    object.categoria.trim(),
    object.tipo_aviso,
    object.facultad,
    object.lugar.trim(),
    object.fecha_suceso,
    object.contacto.trim(),
    object.imagen_url,
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

export async function updateObject(id: string, userId: string, object: NewObject) {
  const database = await getDatabase();
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
    object.imagen_url,
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
