"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Bookmark = {
    id: string;
    title: string;
    url: string;
};

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        let channel: any;

        const setup = async () => {
            const { data } = await supabase.auth.getSession();

            if (!data.session) {
                router.push("/");
                return;
            }

            setEmail(data.session.user.email ?? null);
            await fetchBookmarks();

            channel = supabase
                .channel("bookmarks-channel")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "bookmarks",
                    },
                    () => {
                        fetchBookmarks();
                    }
                )
                .subscribe();

            setLoading(false);
        };

        setup();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [router]);

    const fetchBookmarks = async () => {
        const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setBookmarks(data);
        }
    };

    const isValidUrl = (value: string) => {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    };

    const addBookmark = async () => {
        const trimmedTitle = title.trim();
        const trimmedUrl = url.trim();

        if (!trimmedTitle || !trimmedUrl) return;
        if (!isValidUrl(trimmedUrl)) {
            alert("Please enter a valid URL (include https://)");
            return;
        }

        setAdding(true);

        const { data: sessionData } = await supabase.auth.getSession();

        await supabase.from("bookmarks").insert({
            title: trimmedTitle,
            url: trimmedUrl,
            user_id: sessionData.session?.user.id,
        });

        setTitle("");
        setUrl("");
        setAdding(false);
    };

    const deleteBookmark = async (id: string) => {
        await supabase.from("bookmarks").delete().eq("id", id);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-gray-600">
                        Logged in as: {email}
                    </p>
                </div>
                <button
                    onClick={logout}
                    className="bg-gray-800 text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-900 transition"
                >
                    Logout
                </button>
            </div>

            <div className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border p-2 rounded w-1/4"
                />
                <input
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="border p-2 rounded w-1/3"
                />
                <button
                    onClick={addBookmark}
                    disabled={adding || !title.trim() || !url.trim()}
                    className="bg-black text-white px-4 py-2 rounded cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {adding ? "Adding..." : "Add"}
                </button>
            </div>

            <div>
                {bookmarks.length === 0 && (
                    <p className="text-gray-500">No bookmarks yet.</p>
                )}

                {bookmarks.map((bookmark) => (
                    <div
                        key={bookmark.id}
                        className="mb-3 border p-4 rounded flex justify-between items-center"
                    >
                        <div>
                            <p className="font-medium">{bookmark.title}</p>
                            <a
                                href={bookmark.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline text-sm"
                            >
                                {bookmark.url}
                            </a>
                        </div>

                        <button
                            onClick={() => deleteBookmark(bookmark.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer hover:bg-red-600 transition"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}