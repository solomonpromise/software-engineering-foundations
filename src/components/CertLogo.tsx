import logoUrl from "@/assets/course-logo.png";
export function LogoMark() {
  return <span className="inline-flex size-16 items-center justify-center rounded-xl bg-header-accent"><img src={logoUrl} alt="" className="size-12" /></span>;
}
