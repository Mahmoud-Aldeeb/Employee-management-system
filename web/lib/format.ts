export function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export function shortName(fullName: string) {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);

  return last ? `${first} ${last[0]}.` : first;
}
