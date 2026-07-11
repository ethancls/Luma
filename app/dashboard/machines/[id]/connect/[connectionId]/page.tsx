"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, ArrowsOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ConnectionInfo {
  id: string;
  name: string;
  protocol: string;
  host: string | null;
  port: number;
  username: string;
}

export default function ConnectPage() {
  const params = useParams();
  const machineId = params.id as string;
  const connectionId = params.connectionId as string;

  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const [scriptsReady, setScriptsReady] = useState(false);

  useEffect(() => {
    fetch(`/api/connections/${connectionId}`)
      .then((r) => r.json())
      .then((json) => setConnection(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [connectionId]);

  useEffect(() => {
    const scripts = [
      "Namespace.js", "IntegerPool.js", "Version.js", "Position.js", "Event.js",
      "ArrayBufferReader.js", "ArrayBufferWriter.js", "StringReader.js", "StringWriter.js",
      "BlobReader.js", "BlobWriter.js", "DataURIReader.js", "JSONReader.js",
      "InputStream.js", "OutputStream.js",
      "Parser.js", "UTF8Parser.js",
      "Status.js",
      "Tunnel.js",
      "Layer.js",
      "Display.js",
      "Keyboard.js", "Mouse.js", "Touch.js", "InputSink.js", "KeyEventInterpreter.js",
      "AudioContextFactory.js", "AudioPlayer.js", "RawAudioFormat.js",
      "Client.js",
    ];

    let cancelled = false;
    const loaded = new Set<string>();

    async function loadScripts() {
      try {
        for (const s of scripts) {
          if (cancelled) return;
          await new Promise<void>((resolve, reject) => {
            if (loaded.has(s)) return resolve();
            const script = document.createElement("script");
            script.src = `/guacamole/${s}`;
            script.onload = () => { loaded.add(s); resolve(); };
            script.onerror = () => reject(new Error(`Failed: ${s}`));
            document.head.appendChild(script);
          });
        }
        if (!cancelled) setScriptsReady(true);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Script load failed");
      }
    }

    loadScripts();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!scriptsReady || !connection || !displayRef.current) return;

    const Guacamole = (window as any).Guacamole;
    if (!Guacamole) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/connect/${connectionId}/ws`;

    const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
    const client = new Guacamole.Client(tunnel);
    const display = client.getDisplay();

    displayRef.current.innerHTML = "";
    displayRef.current.appendChild(display.getElement());

    client.onerror = (err: any) => {
      setError(err?.message ?? "Connection error");
    };

    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (code: number) => client.sendKeyEvent(1, code);
    keyboard.onkeyup = (code: number) => client.sendKeyEvent(0, code);

    const mouse = new Guacamole.Mouse(display.getElement());
    mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (state: any) => {
      client.sendMouseState(state);
    };

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [scriptsReady, connection, connectionId]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-black">
        <div className="flex items-center gap-4 border-b border-neutral-800 px-4 py-3">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-red-400">{error}</p>
        <Link href={`/dashboard/machines/${machineId}`}>
          <Button variant="outline"><ArrowLeft className="size-4" /> Back</Button>
        </Link>
      </div>
    );
  }

  if (!connection) return null;

  return (
    <div className="flex h-screen flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-2">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <Link href={`/dashboard/machines/${machineId}`} className="hover:text-white transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <span className="font-medium text-white">{connection.name}</span>
          <span className="text-neutral-600">·</span>
          <span>{connection.protocol.toUpperCase()}</span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono">{connection.host}:{connection.port}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white"
            onClick={() => { if (displayRef.current?.requestFullscreen) displayRef.current.requestFullscreen(); }}>
            <ArrowsOut className="size-4" />
          </Button>
          <Link href={`/dashboard/machines/${machineId}`}>
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              <X className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div ref={displayRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
