"use client";

import { useTransition } from "react";
import { deleteProductAndRedirect } from "../actions";

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`حذف المنتج «${name}»؟ لا يمكن التراجع.`)) return;
    startTransition(async () => {
      await deleteProductAndRedirect(id);
    });
  }

  return (
    <button
      onClick={handleClick}
      className="btn-danger !px-3"
      disabled={isPending}
    >
      {isPending ? "حذف..." : "حذف"}
    </button>
  );
}
