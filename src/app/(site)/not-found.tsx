export default function NotFound() {
  return (
    <div className="space-y-3 py-20 text-center">
      <h1 className="font-serif text-3xl">找不到頁面</h1>
      <p className="text-muted text-sm">請回到目錄重新選擇篇章。</p>
      <p>
        <a href="/toc/" className="text-accent hover:underline">
          全書目錄
        </a>
      </p>
    </div>
  );
}
