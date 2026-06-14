// Turkish Airlines wild goose roundel
export default function Logo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Turkish Airlines">
      <circle cx="32" cy="32" r="30" fill="#E30A17" />
      <path
        fill="#d6d6d6"
        d="M14 42 C10 34 14 26 22 24 C20 20 22 16 27 15 C28 19 27 22 25 25 C34 23 45 25 54 20 C50 30 42 36 33 37 C39 39 45 39 50 37 C43 44 32 47 23 45 C18 44 15 44 14 42 Z"
      />
    </svg>
  );
}
