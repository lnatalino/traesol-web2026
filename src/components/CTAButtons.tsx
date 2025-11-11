export default function CTAButtons() {
  const btn = "px-4 py-2 rounded-xl border shadow hover:shadow-md transition";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <a className={btn} href="#voluntariado">Hazte voluntario</a>
      <a className={btn} href="#hazte-socio">Hazte socio</a>
      <a className={btn} href="#aportes">Quiero hacer mi aporte</a>
      <a className={btn} href="#empresas">Contacto empresas</a>
    </div>
  );
}
