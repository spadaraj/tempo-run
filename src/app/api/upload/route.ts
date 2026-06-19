import { NextResponse } from "next/server";
import { Readable } from "stream";
import unzipper from "unzipper";
import { parseAppleHealthExport, type HealthStats } from "@/lib/apple-health";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let file: File;
  try {
    const formData = await req.formData();
    const f = formData.get("file");
    if (!(f instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    file = f;
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to read upload: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  const name = file.name.toLowerCase();

  if (name.endsWith(".xml")) {
    const stream = Readable.fromWeb(
      file.stream() as unknown as Parameters<typeof Readable.fromWeb>[0],
    );
    try {
      const stats = await parseAppleHealthExport(stream);
      return NextResponse.json(stats);
    } catch (e) {
      return NextResponse.json(
        { error: `XML parse failed: ${(e as Error).message}` },
        { status: 500 },
      );
    }
  }

  if (!name.endsWith(".zip")) {
    return NextResponse.json(
      { error: "Please upload export.zip or export.xml from Apple Health." },
      { status: 400 },
    );
  }

  const zipNodeStream = Readable.fromWeb(
    file.stream() as unknown as Parameters<typeof Readable.fromWeb>[0],
  );

  return new Promise<Response>((resolve) => {
    let handled = false;
    const onDone = (res: Response) => {
      if (!handled) {
        handled = true;
        resolve(res);
      }
    };

    zipNodeStream
      .pipe(unzipper.Parse())
      .on("entry", (entry) => {
        const path: string = entry.path;
        const lower = path.toLowerCase();
        if (
          lower.endsWith("export.xml") &&
          !lower.includes("export_cda")
        ) {
          parseAppleHealthExport(entry as unknown as Readable)
            .then((stats: HealthStats) =>
              onDone(NextResponse.json(stats)),
            )
            .catch((e: Error) =>
              onDone(
                NextResponse.json(
                  { error: `XML parse failed: ${e.message}` },
                  { status: 500 },
                ),
              ),
            );
        } else {
          entry.autodrain();
        }
      })
      .on("close", () => {
        onDone(
          NextResponse.json(
            { error: "Could not find export.xml inside the zip." },
            { status: 400 },
          ),
        );
      })
      .on("error", (e: Error) =>
        onDone(
          NextResponse.json(
            { error: `Zip read failed: ${e.message}` },
            { status: 500 },
          ),
        ),
      );
  });
}
