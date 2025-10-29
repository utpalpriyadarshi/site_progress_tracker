declare module 'react-native-bcrypt' {
  export function hash(
    data: string,
    saltRounds: number,
    callback: (err: Error | undefined, hash: string) => void
  ): void;

  export function compare(
    data: string,
    encrypted: string,
    callback: (err: Error | undefined, result: boolean) => void
  ): void;

  export function hashSync(data: string, saltRounds: number): string;
  export function compareSync(data: string, encrypted: string): boolean;
  export function genSaltSync(rounds?: number): string;
  export function genSalt(
    rounds: number,
    callback: (err: Error | undefined, salt: string) => void
  ): void;
}
