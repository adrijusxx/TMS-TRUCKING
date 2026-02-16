import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// Helper to get fields for entity type (Simplified for now, can be expanded)
// In a real scenario, this might read from schema-reference or Prisma DMMF
const getTemplateFields = (entityType: string) => {
    switch (entityType.toLowerCase()) {
        case "driver":
            return ["firstName", "lastName", "email", "phone", "licenseNumber", "state", "status"];
        case "load":
            return ["loadNumber", "customerName", "pickupDate", "deliveryDate", "originCity", "originState", "destinationCity", "destinationState", "rate", "driverName"];
        case "truck":
            return ["truckNumber", "vin", "make", "model", "year", "licensePlate", "status"];
        case "trailer":
            return ["trailerNumber", "vin", "make", "model", "year", "licensePlate", "status"];
        case "customer":
            return ["customerNumber", "name", "email", "phone", "address", "city", "state", "zip"];
        case "vendor":
            return ["vendorNumber", "name", "email", "phone", "address", "city", "state", "zip", "type"];
        case "location":
            return ["name", "address", "city", "state", "zip", "type"];
        default:
            return ["column1", "column2", "column3"];
    }
};

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

        const fields = getTemplateFields(entityType);
        const csvContent = fields.join(",") + "\n";

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
