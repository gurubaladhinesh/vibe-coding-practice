export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" className="fill-primary" />
      <path
        d="M12 11.5h11.5a2 2 0 0 1 2 2V16"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 11.5v17a2 2 0 0 0 2 2h7"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15.5 17h7M15.5 21.5h4"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="27" cy="26" r="6.5" className="fill-primary-foreground/15" />
      <path
        d="M24.2 26.2 26.1 28l4-4.2"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
