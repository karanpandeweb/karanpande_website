import { Outlet } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";
import LenisProvider from "./LenisProvider";

export default function SiteLayout() {
  return (
    <LenisProvider>
      <div className="bg-[color:var(--cream)] text-[color:var(--ink)]">
        <div className="grain" aria-hidden />
        <Nav />
        <main id="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </LenisProvider>
  );
}
