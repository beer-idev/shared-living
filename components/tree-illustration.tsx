export function TreeIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? "tree tree--compact" : "tree"} viewBox="0 0 260 238" role="img" aria-label="A flourishing harmony tree">
      <ellipse cx="129" cy="215" rx="91" ry="14" fill="#AED9CB" opacity=".55" />
      <path d="M127 206V126" stroke="#8C6043" strokeWidth="17" strokeLinecap="round" />
      <path d="M127 158c-21-14-31-28-39-47M129 164c23-15 36-31 44-53" stroke="#8C6043" strokeWidth="8" strokeLinecap="round" />
      <circle cx="75" cy="112" r="43" fill="#7ED7A7" />
      <circle cx="113" cy="72" r="51" fill="#A9DFC5" />
      <circle cx="163" cy="90" r="48" fill="#6FCB9A" />
      <circle cx="177" cy="134" r="47" fill="#55BE83" />
      <circle cx="118" cy="126" r="57" fill="#8ED8A8" />
      <circle cx="76" cy="74" r="35" fill="#66C78F" />
      <circle cx="104" cy="42" r="7" fill="#FFE2A7" />
      <circle cx="70" cy="80" r="7" fill="#FFD3A3" />
      <circle cx="154" cy="74" r="8" fill="#FFE4AA" />
      <circle cx="180" cy="127" r="7" fill="#FFD3A3" />
      <path d="M35 46c10 4 14 8 18 18 4-10 8-14 18-18-10-4-14-8-18-18-4 10-8 14-18 18Z" fill="#fff" opacity=".9" />
      <path d="M199 45c7 3 10 6 13 13 3-7 6-10 13-13-7-3-10-6-13-13-3 7-6 10-13 13Z" fill="#fff" opacity=".9" />
    </svg>
  );
}
