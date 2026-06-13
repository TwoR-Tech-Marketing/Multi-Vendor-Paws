export type PortalSelectOption = {
  value: string;
  label: string;
};

export type PortalSelectProps = {
  id?: string;
  value: string;
  options: PortalSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};
