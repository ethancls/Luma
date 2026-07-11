/**
 * Build the initial handshake string for guacd.
 *
 * The guacd connection protocol uses null-delimited fields:
 *   protocol\0host\0port\0username\0password\0\0\0;
 *
 * The double \0\0 marks the end of connection params + start of guacd params.
 * The final ; is the Guacamole instruction terminator.
 */
export function buildGuacdHandshake(
  protocol: string,
  host: string,
  port: number,
  username: string,
  password: string,
): string {
  return `${protocol}\0${host}\0${String(port)}\0${username}\0${password}\0\0\0;`;
}
