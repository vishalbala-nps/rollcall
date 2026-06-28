/*
  Warnings:

  - You are about to drop the `_CourseFaculty` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `facultyId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_CourseFaculty_B_index";

-- DropIndex
DROP INDEX "_CourseFaculty_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CourseFaculty";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_BatchToCourse" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_BatchToCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BatchToCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "universityId" INTEGER NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Course_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Course_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("createdAt", "id", "name", "roomId", "universityId", "updatedAt") SELECT "createdAt", "id", "name", "roomId", "universityId", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_BatchToCourse_AB_unique" ON "_BatchToCourse"("A", "B");

-- CreateIndex
CREATE INDEX "_BatchToCourse_B_index" ON "_BatchToCourse"("B");
