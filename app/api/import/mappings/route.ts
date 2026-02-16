import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createMappingSchema = z.object({
    name: z.string().min(1),
    entityType: z.string().min(1),
    mapping: z.record(z.string(), z.string()),
});

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

        const mappings = await prisma.importMappingProfile.findMany({
            where: {
                userId: session.user.id,
                entityType,
                companyId: session.user.companyId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(mappings);
    } catch (error) {
        console.error("[IMPORT_MAPPINGS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, entityType, mapping } = createMappingSchema.parse(body);

        const newMapping = await prisma.importMappingProfile.create({
            data: {
                name,
                entityType,
                mapping,
                userId: session.user.id,
                companyId: session.user.companyId,
            },
        });

        return NextResponse.json(newMapping);
    } catch (error) {
        console.error("[IMPORT_MAPPINGS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
