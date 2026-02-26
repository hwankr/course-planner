'use client';

import { useState } from 'react';

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-sm text-gray-400 transition-colors hover:text-white cursor-pointer"
      title="클릭하여 복사"
    >
      Contact : {email}
      {copied && (
        <span className="ml-2 text-xs text-[#00AACA]">복사됨!</span>
      )}
    </button>
  );
}
