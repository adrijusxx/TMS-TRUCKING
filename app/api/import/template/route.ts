import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { getEntityConfig } from "@/lib/import-export/entity-config";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const entityType = searchParams.get("entityType");

        if (!entityType) {
            return new NextResponse("Entity Type is required", { status: 400 });
        }

        const config = getEntityConfig(entityType);
        if (!config) {
            return new NextResponse("Unknown entity type", { status: 400 });
        }

        const headers = config.fields.map(f => f.label.replace(' *', ''));
        const headerRow = headers.join(",");

        // Build example data row from config
        const exampleValues = config.fields.map(f => {
            const example = config.exampleRow?.[f.key];
            if (example) return `"${example}"`;
            return '';
        });
        const exampleRow = exampleValues.join(",");

        const csvContent = headerRow + "\n" + exampleRow + "\n";

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${entityType}_template.csv"`,
            },
        });
    } catch (error) {
        console.error("[IMPORT_TEMPLATE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
