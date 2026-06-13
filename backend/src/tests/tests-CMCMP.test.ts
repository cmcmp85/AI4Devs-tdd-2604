import { Candidate, Prisma } from '@prisma/client';
import { addCandidate } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';
import { prismaMock } from '../test/prismaSingleton';

const validCandidateData = {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana@example.com',
    phone: '612345678',
};

const savedCandidateRecord: Candidate = {
    id: 1,
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana@example.com',
    phone: '612345678',
    address: null,
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Inserción de candidatos', () => {
    describe('Recepción y validación de datos del formulario', () => {
        it('validateCandidateData debe rechazar cuando falta firstName (campo obligatorio)', () => {
            const dataWithoutFirstName = {
                lastName: 'García',
                email: 'ana@example.com',
            };

            expect(() => validateCandidateData(dataWithoutFirstName)).toThrow('Invalid name');
        });

        it('addCandidate debe abortar antes de persistir si el email es inválido', async () => {
            const dataWithInvalidEmail = {
                ...validCandidateData,
                email: 'correo-sin-formato',
            };

            await expect(addCandidate(dataWithInvalidEmail)).rejects.toThrow(/Invalid email/);
            expect(prismaMock.candidate.create).not.toHaveBeenCalled();
        });
    });

    describe('Guardado en base de datos', () => {
        it('debe invocar prisma.candidate.create con CandidateCreateInput y devolver el registro', async () => {
            prismaMock.candidate.create.mockResolvedValue(savedCandidateRecord);

            const result = await addCandidate(validCandidateData);

            expect(prismaMock.candidate.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.candidate.create).toHaveBeenCalledWith({
                data: {
                    firstName: validCandidateData.firstName,
                    lastName: validCandidateData.lastName,
                    email: validCandidateData.email,
                    phone: validCandidateData.phone,
                },
            });
            expect(result).toEqual(savedCandidateRecord);
        });

        it('debe traducir PrismaClientKnownRequestError P2002 a mensaje de email duplicado', async () => {
            const duplicateEmailError = new Prisma.PrismaClientKnownRequestError(
                'Unique constraint failed on the fields: (`email`)',
                { code: 'P2002', clientVersion: '5.22.0', meta: { target: ['email'] } },
            );
            prismaMock.candidate.create.mockRejectedValue(duplicateEmailError);

            await expect(addCandidate(validCandidateData)).rejects.toThrow(
                'The email already exists in the database',
            );
        });

        it('debe propagar errores de Prisma distintos de P2002 sin transformarlos', async () => {
            const connectionError = new Error('Database connection failed');
            prismaMock.candidate.create.mockRejectedValue(connectionError);

            await expect(addCandidate(validCandidateData)).rejects.toThrow('Database connection failed');
        });
    });
});
