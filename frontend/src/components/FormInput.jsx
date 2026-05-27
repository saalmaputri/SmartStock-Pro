export default function FormInput({ label, as = 'input', children, ...props }) {
  const Control = as
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      {children || <Control className="field" {...props} />}
    </label>
  )
}
