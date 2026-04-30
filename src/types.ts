/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  MASTER = 'MASTER',
  USER = 'USER',
}

export interface Synod {
  id: string;
  name: string;
}

export interface Pastorate {
  id: string;
  name: string;
  synodId: string;
}

export interface Congregation {
  id: string;
  name: string;
  pastorateId: string;
  synodId: string;
}

export interface Member {
  id: string;
  name: string;
  gender: 'MASCULINO' | 'FEMININO';
  birthDate: string; // ISO string
  category: string;
  residence: string;
  contact1: string;
  contact2: string;
  email: string;
  facebook: string;
  isDisabled: boolean;
  disabilityType: string;
  academicLevel: string;
  fieldOfStudy: string;
  academicStatus: string;
  professionalStatus: string;
  employmentType: string;
  fieldOfWork: string;
  experience: string;
  status: 'ACTIVO' | 'NÃO ACTIVO';
  // Novos Campos requested
  isBaptized: boolean;
  civilStatus: string;
  profession: string;
  role: string; // ex: Líder, Membro, etc.
  congregationId: string;
  pastorateId: string;
  synodId: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  password?: string; // Adicionado para login simples
  role: UserRole;
  name: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
