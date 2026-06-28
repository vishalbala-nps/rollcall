/*
  Warnings:

  - Added the required column `universityId` to the `Beacon` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Beacon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "universityId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Beacon_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Beacon_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Beacon" ("createdAt", "id", "name", "roomId", "secret", "updatedAt") SELECT "createdAt", "id", "name", "roomId", "secret", "updatedAt" FROM "Beacon";
DROP TABLE "Beacon";
ALTER TABLE "new_Beacon" RENAME TO "Beacon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
