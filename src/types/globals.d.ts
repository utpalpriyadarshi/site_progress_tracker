// React Native provides these web globals at runtime but they are not
// included in the ES2019/ES2020 TypeScript lib. Declare them here so
// TypeScript resolves the calls without requiring the full 'dom' lib.
declare function btoa(data: string): string;
declare function atob(data: string): string;
declare function unescape(str: string): string;
declare function escape(str: string): string;
