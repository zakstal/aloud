interface HeadingProps {
  title: string;
  description: string;
  className: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, description, className = "", style }) => {
  return (
    <div>
      <h2 className={"text-3xl font-bold tracking-tight " + className} style={style}>{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
