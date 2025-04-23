export function formatDate(date) {
  const dateString = new Date(date).toISOString().split("T")[0];
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}
export function formatDateHour(date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
