import { redirect } from "next/navigation";

// Sayfa modülleri artık "Şablonlar" sayfasıyla birleşti
export default function SayfaRedirect() {
  redirect("/firma/template");
}
