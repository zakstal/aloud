interface HeadingProps {
  title: string;
  description: string;
  className: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, description, className = "" }) => {
  return (
    <div>
      <h2 className={"text-3xl font-bold tracking-tight " + className}>{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
