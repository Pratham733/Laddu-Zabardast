import { TextField } from "@mui/material";

interface MultilineTextFieldsProps {
  id?: string;
  name?: string;
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean;
  maxRows?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function MultilineTextFields({
  id,
  name,
  label,
  value,
  onChange,
  multiline = true,
  maxRows = 4,
  required,
  placeholder,
  className,
}: MultilineTextFieldsProps) {
  return (
    <TextField
      id={id}
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      multiline={multiline}
      maxRows={maxRows}
      required={required}
      placeholder={placeholder}
      className={className}
      fullWidth
      variant="outlined"
    />
  );
}
