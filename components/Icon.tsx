const IC: Record<string, string> = {
  paw: '<circle cx="6.5" cy="10" r="1.9"/><circle cx="10" cy="6" r="1.9"/><circle cx="14.5" cy="6" r="1.9"/><circle cx="18" cy="10" r="1.9"/><path d="M8 17.2c0-2.8 1.9-5.2 4-5.2s4 2.4 4 5.2c0 1.7-1.3 2.3-2.6 2-.6-.2-.9-.4-1.4-.4s-.8.2-1.4.4C9.3 19.5 8 18.9 8 17.2z"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  arrow: '<path d="M9 5l7 7-7 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  vacuna: '<path d="m18 2 4 4M17 7l-9.5 9.5M14 4l6 6M7 13l4 4M6.5 17.5 3 21"/><path d="m10 7 7 7"/>',
  desparasitacion: '<path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  consulta: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
  estudio: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>',
  sintoma: '<path d="M6 3h9l4 4v14H6z"/><path d="M9.5 11h6M9.5 14.5h6M9.5 18h3"/>',
  medicacion: '<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="m9.5 8.5 5 6"/>',
  peso: '<path d="M5 20h14l-1.5-11h-11z"/><circle cx="12" cy="6" r="2.5"/><path d="M12 13v3"/>',
  clip: '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/>',
  file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  turno: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/><path d="m9 15 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  out: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
};

export function Icon({ n, className = "" }: { n: string; className?: string }) {
  return <svg className={`i ${className}`} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: IC[n] || "" }} />;
}

/** The white circle with an arrow at the end of black buttons. */
export const Go = () => (
  <span className="go">
    <Icon n="arrow" />
  </span>
);
