-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "inputs" JSONB NOT NULL,
    "comparables" JSONB,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_shareToken_key" ON "Scenario"("shareToken");

-- CreateIndex
CREATE INDEX "Scenario_workspaceId_idx" ON "Scenario"("workspaceId");
