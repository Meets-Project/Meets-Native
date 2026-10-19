// Promove uma conta existente a administrador: npm run make-admin -- email@exemplo.com
// Use para criar o primeiro administrador; depois, admins promovem outros pela tela Manter Usuários.
import { pool } from './db.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Informe o e-mail. Ex.: npm run make-admin -- ana@exemplo.com');
  process.exit(1);
}

try {
  const result = await pool.query(
    `UPDATE users SET account_type='admin', updated_at=NOW() WHERE lower(email)=$1 RETURNING id, name, email`,
    [email]
  );
  if (!result.rows[0]) {
    console.error(`Nenhuma conta com o e-mail ${email}. Cadastre a conta no app primeiro.`);
    process.exitCode = 1;
  } else {
    const u = result.rows[0];
    await pool.query(
      `INSERT INTO admin_actions(admin_id, action, target_type, target_id, note) VALUES (NULL, 'user_promoted', 'user', $1, 'Promovido pelo comando make-admin')`,
      [u.id]
    );
    console.log(`${u.name} <${u.email}> agora é administrador.`);
  }
} finally {
  await pool.end();
}
