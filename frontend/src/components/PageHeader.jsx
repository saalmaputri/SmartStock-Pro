export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h2 className="page-title lg:hidden">{title}</h2>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {action}
    </div>
  )
}
