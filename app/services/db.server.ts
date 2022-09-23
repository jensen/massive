import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
  prisma.$connect();
}

export default function createClient() {
  return prisma;
}

export const selectObjects = () => {
  return createClient().file.findMany();
};

export const createObject = (data: {
  id: string;
  name: string;
  size: number;
  type: string;
}) => {
  return createClient().file.create({
    data,
  });
};
