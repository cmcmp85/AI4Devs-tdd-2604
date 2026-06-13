# Prompts CMCMP — Generación de tests unitarios (inserción de candidatos)

Registro en orden de los prompts usados en la conversación y la acción tomada en cada paso.

---

## 1. Exploración del backend

**Prompt:**

> Explora la estructura del proyecto backend (carpeta backend/src). Identifica:
> 1. El archivo y función que gestionan la inserción de un nuevo candidato (controlador y/o servicio).
> 2. El ORM/cliente de base de datos utilizado (Prisma, TypeORM, etc.) y dónde se inicializa.
> 3. Los modelos/entidades relacionados con Candidate (y entidades asociadas como Education, WorkExperience, Resume si existen).
> 4. La configuración actual de Jest (jest.config, scripts de test en package.json).
>
> Resume brevemente cada punto con la ruta del archivo correspondiente, sin modificar nada todavía.

**Acción / respuesta:**

- Análisis de solo lectura de `backend/src`.
- Identificado el flujo `POST /candidates` → `addCandidate` (`candidateService.ts`) → `Candidate.save()` (Prisma).
- ORM: **Prisma** + PostgreSQL; schema en `prisma/schema.prisma`; instancias en modelos de dominio e `index.ts`.
- Entidades: `Candidate`, `Education`, `WorkExperience`, `Resume` (schema Prisma + clases en `domain/models/`).
- Jest configurado en `jest.config.js` (`ts-jest`, `node`); script `npm test`; sin archivos de test aún.
- **Sin cambios en el código.**

---

## 2. Diseño de la batería de tests

**Prompt:**

> Basándote en la función de inserción de candidatos identificada, propón una lista de tests unitarios organizados en dos familias:
>
> 1. Recepción y validación de datos del formulario/API (ej. campos obligatorios, formatos válidos de email/teléfono, longitud de campos, datos opcionales, manejo de arrays vacíos como educación/experiencia).
> 2. Guardado en base de datos (ej. llamada correcta a Prisma con los datos esperados, manejo de errores de base de datos, creación de entidades relacionadas, manejo de duplicados si aplica).
>
> Para cada test indica: nombre descriptivo, qué se está probando, y qué se debe mockear. No escribas código todavía, solo la lista.

**Acción / respuesta:**

- Propuesta de **54 casos de test** en dos familias, basados en `validateCandidateData` y `addCandidate`.
- Familia 1: validación pura del validador + integración servicio/validación (campos obligatorios, regex email/teléfono, arrays opcionales, CV).
- Familia 2: persistencia con mocks de Prisma o de modelos (`create`, entidades relacionadas, P2002, errores genéricos).
- **Sin código generado.**

---

## 3. Configuración del mock de Prisma

**Prompt:**

> Crea (o indica cómo configurar) un mock de PrismaClient siguiendo las recomendaciones de la documentación oficial de Prisma para unit testing con Jest, usando jest-mock-extended. El mock debe poder usarse para simular las funciones create/save de las entidades relacionadas con Candidate. Muéstrame el código de configuración necesario (mock del cliente y, si aplica, un singleton mockeado).

**Acción / respuesta:**

- Instalado `jest-mock-extended`.
- Creado cliente singleton: `backend/src/infrastructure/database/client.ts`.
- Creado setup de tests: `backend/src/test/prismaSingleton.ts` (patrón singleton oficial de Prisma con `mockDeep`, `mockReset`, `DeepMockProxy`).
- Refactorizados `Candidate`, `Education`, `WorkExperience`, `Resume` e `index.ts` para usar el cliente compartido.
- Actualizado `jest.config.js` con `setupFilesAfterEnv`.
- Documentado uso de `prismaMock.candidate.create`, `.education.create`, etc.

---

## 4. Implementación inicial de tests

**Prompt:**

> Crea el archivo backend/src/tests/tests-CMCMP.test.ts con tests unitarios en Jest para la funcionalidad de insertar candidatos.
>
> Requisitos:
> - Mockea Prisma (no debe tocarse la base de datos real).
> - Incluye al menos un test de la familia "recepción de datos del formulario" (ej. validación de un campo obligatorio o formato inválido).
> - Incluye al menos un test de la familia "guardado en base de datos" (ej. que se llame a prisma.candidate.create con los datos correctos, y un test de manejo de error si la base de datos lanza una excepción).
> - Usa describe/it con nombres descriptivos en español o inglés (consistente con el resto del proyecto).
> - Sigue las buenas prácticas: arrange-act-assert, mocks limpios entre tests (beforeEach con jest.clearAllMocks), sin dependencias entre tests.
>
> Después de generarlo, ejecuta los tests y corrige cualquier error de compilación o ejecución.

**Acción / respuesta:**

- Creado `backend/src/tests/tests-CMCMP.test.ts` con **6 tests** (3 validación + 3 persistencia).
- Uso de `prismaMock` del singleton; `beforeEach` con `jest.clearAllMocks()`.
- Ejecutado `npm test`: **6 passed**, sin tocar la base de datos real.

---

## 5. Revisión y depuración de tests

**Prompt:**

> Revisa el archivo backend/src/tests/tests-CMCMP.test.ts generado:
> 1. Elimina tests redundantes o que no aporten cobertura real.
> 2. Asegúrate de que los mensajes de assertion sean claros.
> 3. Verifica que los mocks reflejan fielmente la firma real de las funciones de Prisma usadas en el código (tipos correctos).
> 4. Ejecuta `npm test -- tests-CMCMP` y muéstrame el resultado.

**Acción / respuesta:**

- Eliminado 1 test redundante (validación de email duplicada solo en `validateCandidateData`); **6 → 5 tests**.
- Nombres de `it()` más descriptivos (mensaje custom en `expect` no soportado por los tipos de Jest del proyecto).
- Tipado con `Candidate` de `@prisma/client` y error P2002 como `Prisma.PrismaClientKnownRequestError`.
- Assertion de `create` alineada con `{ data: { firstName, lastName, email, phone } }`.
- Ejecutado `npm test -- tests-CMCMP`: **5 passed**.

---

## 6. Documentación de prompts (este archivo)

**Prompt:**

> Crea el archivo prompts/prompts-CMCMP.md que recoja, en orden, todos los prompts que he usado en esta conversación para generar los tests, junto con un breve resumen de la respuesta/acción tomada en cada paso.

**Acción / respuesta:**

- Creado este documento con el registro cronológico de los 6 prompts y sus resultados.

---

## Artefactos finales

| Archivo | Descripción |
|---------|-------------|
| `backend/src/infrastructure/database/client.ts` | Singleton PrismaClient |
| `backend/src/test/prismaSingleton.ts` | Mock global para Jest |
| `backend/jest.config.js` | Config Jest + `setupFilesAfterEnv` |
| `backend/src/tests/tests-CMCMP.test.ts` | 5 tests unitarios (validación + persistencia) |
| `prompts/prompts-CMCMP.md` | Este registro de prompts |

**Comando de verificación:** `npm test -- tests-CMCMP` (desde `backend/`)
