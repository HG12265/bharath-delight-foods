// Single recipe post detail pages with product card callouts
interface PageProps {
  params: { slug: string };
}

export default function BlogPostPage({ params }: PageProps) {
  const { slug } = params;
  return <div>Blog Recipe Post: {slug}</div>;
}