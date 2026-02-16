import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Await params before using
        const { id } = await params;

        if (!id) {
            return new NextResponse("Mapping ID is required", { status: 400 });
        }

        // Verify ownership
        const existingMapping = await prisma.importMappingProfile.findUnique({
            where: {
                id,
            },
        });

        if (!existingMapping) {
            return new NextResponse("Mapping not found", { status: 404 });
        }

        if (existingMapping.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        await prisma.importMappingProfile.delete({
            where: {
                id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[IMPORT_MAPPINGS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
