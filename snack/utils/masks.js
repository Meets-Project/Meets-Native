// Utilitários de formatação (máscaras) e validações para formulários

/**
 * Aplica máscara de data DD/MM/AAAA
 * @param {string} value
 * @returns {string}
 */
export function maskDate(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Aplica máscara de horário HH:MM
 * @param {string} value
 * @returns {string}
 */
export function maskTime(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function formatLocalDate(value, options = {}) {
  if (!value) return 'Data não informada';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'Data inválida' : value.toLocaleDateString('pt-BR', options);
  }
  const raw = String(value).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 'Data inválida';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR', options);
}

/**
 * Aplica máscara de telefone (10 ou 11 dígitos)
 * Ex: (11) 98765-4321 ou (11) 3456-7890
 * @param {string} value
 * @returns {string}
 */
export function maskPhone(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Aplica máscara de CPF 999.999.999-99
 * @param {string} value
 * @returns {string}
 */
export function maskCPF(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Aplica máscara de CEP 99999-999
 * @param {string} value
 * @returns {string}
 */
export function maskCEP(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Valida data no formato DD/MM/AAAA ou YYYY-MM-DD
 * @param {string} dateStr
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDate(dateStr = '') {
  if (!dateStr || !dateStr.trim()) return { valid: true };

  const str = dateStr.trim();

  // Caso esteja no formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/').map(Number);
    if (m < 1 || m > 12) return { valid: false, error: 'Mês deve ser entre 01 e 12.' };
    if (d < 1 || d > 31) return { valid: false, error: 'Dia deve ser entre 01 e 31.' };
    if (y < 1900 || y > 2100) return { valid: false, error: 'Ano deve estar entre 1900 e 2100.' };

    // Validar dias por mês (incluindo ano bissexto)
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d > daysInMonth) {
      return { valid: false, error: `Dia inválido para o mês ${m} (máximo ${daysInMonth} dias).` };
    }
    return { valid: true };
  }

  // Caso esteja no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    if (m < 1 || m > 12) return { valid: false, error: 'Mês deve ser entre 01 e 12.' };
    if (d < 1 || d > 31) return { valid: false, error: 'Dia deve ser entre 01 e 31.' };
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d > daysInMonth) {
      return { valid: false, error: `Dia inválido para o mês ${m} (máximo ${daysInMonth} dias).` };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Data incompleta. Use o formato DD/MM/AAAA.' };
}

/**
 * Valida horário no formato HH:MM
 * @param {string} timeStr
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTime(timeStr = '') {
  if (!timeStr || !timeStr.trim()) return { valid: true };

  const str = timeStr.trim();
  if (!/^\d{2}:\d{2}$/.test(str)) {
    return { valid: false, error: 'Horário incompleto. Use o formato HH:MM.' };
  }

  const [hours, minutes] = str.split(':').map(Number);
  if (hours < 0 || hours > 23) {
    return { valid: false, error: 'Hora deve ser entre 00 e 23.' };
  }
  if (minutes < 0 || minutes > 59) {
    return { valid: false, error: 'Minutos devem ser entre 00 e 59.' };
  }

  return { valid: true };
}

/**
 * Valida formato de e-mail
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(email = '') {
  if (!email || !email.trim()) {
    return { valid: false, error: 'E-mail é obrigatório.' };
  }
  const clean = email.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(clean)) {
    return { valid: false, error: 'Formato de e-mail inválido (ex: nome@exemplo.com).' };
  }
  return { valid: true };
}

/**
 * Valida senha (mínimo de caracteres)
 * @param {string} password
 * @param {number} minLength
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePassword(password = '', minLength = 6) {
  if (!password) {
    return { valid: false, error: 'Senha é obrigatória.' };
  }
  if (password.length < minLength) {
    return { valid: false, error: `A senha deve conter no mínimo ${minLength} caracteres.` };
  }
  return { valid: true };
}

/**
 * Valida confirmação de senha
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePasswordMatch(password = '', confirmPassword = '') {
  if (!confirmPassword) {
    return { valid: false, error: 'Confirmação de senha é obrigatória.' };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: 'As senhas não coincidem.' };
  }
  return { valid: true };
}

/**
 * Converte data DD/MM/AAAA para YYYY-MM-DD para salvar no backend
 * @param {string} dateStr
 * @returns {string}
 */
export function dateToISO(dateStr = '') {
  if (!dateStr) return '';
  const str = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return str;
}

/**
 * Converte data YYYY-MM-DD para DD/MM/AAAA para exibição amigável
 * @param {string} isoStr
 * @returns {string}
 */
export function isoToDate(isoStr = '') {
  if (!isoStr) return '';
  const str = String(isoStr).trim().slice(0, 10);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    return `${day}/${month}/${year}`;
  }
  return str;
}
