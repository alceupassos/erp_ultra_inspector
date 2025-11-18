export function cn(...args: any[]): string {
  return args
    .flatMap((a) => {
      if (!a) return [];
      if (typeof a === "string") return [a];
      if (typeof a === "object") {
        return Object.entries(a)
          .filter(([, v]) => !!v)
          .map(([k]) => k);
      }
      return [];
    })
    .join(" ");
}
