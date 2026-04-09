/**
 * Mengonversi angka menjadi string terbilang (Indonesian)
 */
export function terbilang(n: number): string {
  if (n < 0) return "Minus " + terbilang(Math.abs(n));
  if (n === 0) return "Nol";

  const num = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];

  let temp = "";
  if (n < 12) {
    temp = " " + num[n];
  } else if (n < 20) {
    temp = terbilang(n - 10) + " Belas";
  } else if (n < 100) {
    temp = terbilang(Math.floor(n / 10)) + " Puluh" + terbilang(n % 10);
  } else if (n < 200) {
    temp = " Seratus" + terbilang(n - 100);
  } else if (n < 1000) {
    temp = terbilang(Math.floor(n / 100)) + " Ratus" + terbilang(n % 100);
  } else if (n < 2000) {
    temp = " Seribu" + terbilang(n - 1000);
  } else if (n < 1000000) {
    temp = terbilang(Math.floor(n / 1000)) + " Ribu" + terbilang(n % 1000);
  } else if (n < 1000000000) {
    temp = terbilang(Math.floor(n / 1000000)) + " Juta" + terbilang(n % 1000000);
  } else if (n < 1000000000000) {
    temp = terbilang(Math.floor(n / 1000000000)) + " Miliar" + terbilang(n % 1000000000);
  } else if (n < 1000000000000000) {
    temp = terbilang(Math.floor(n / 1000000000000)) + " Triliun" + terbilang(n % 1000000000000);
  }

  return temp.trim();
}

export function formatTerbilang(n: number): string {
  const result = terbilang(n);
  return result ? result + " Rupiah" : "";
}

export function formatRupiah(num: number) {
  return "Rp " + Math.abs(num).toLocaleString("id-ID");
}
