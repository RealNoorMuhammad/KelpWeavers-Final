declare module "ejs" {
  const ejs: {
    __express: (
      path: string,
      options: object,
      callback: (err: Error | null, html?: string) => void,
    ) => void;
    renderFile: (
      path: string,
      options: object,
      callback: (err: Error | null, html?: string) => void,
    ) => void;
  };
  export default ejs;
}
