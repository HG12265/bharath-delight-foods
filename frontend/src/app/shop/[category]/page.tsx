// Dynamic category navigation list pages
interface PageProps {
  params: { category: string };
}

export default function CategoryPage({ params }: PageProps) {
  const { category } = params;
  return <div>Category Page: {category}</div>;
}