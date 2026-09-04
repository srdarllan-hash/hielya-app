import { randomUUID } from 'node:crypto';
import { accessSync, constants as fsConstants, existsSync } from 'node:fs';

import {
  CustomerAuthenticationError,
  RequestCustomerOtp,
  VerifyCustomerOtp,
  type CorrelationIdPort,
  type OtpDeliveryPort,
  type SimulatedSmsMessage,
} from '@hielya/application';
import {
  MvpPersistenceDatabase,
  SqliteCustomerAuthenticationRepository,
} from '@hielya/persistence';

import { createAuthHttpHandlers } from './auth-http';

class RuntimeSimulatedSmsGateway implements OtpDeliveryPort {
  send(message: SimulatedSmsMessage): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('simulated SMS is prohibited in production');
    }
    void message;
  }
}

class CryptoCorrelationIdPort implements CorrelationIdPort {
  generate(): string {
    return randomUUID();
  }
}

class RuntimeAuthComposition {
  private persistence?: MvpPersistenceDatabase;
  private requestUseCase?: RequestCustomerOtp;
  private verifyUseCase?: VerifyCustomerOtp;

  private configuration(): {
    repository: SqliteCustomerAuthenticationRepository;
    pepper: Buffer;
  } {
    if (process.env.NODE_ENV === 'production') {
      throw new CustomerAuthenticationError('AUTH_CONFIGURATION_UNAVAILABLE');
    }
    const filename = process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH?.trim();
    const pepperValue = process.env.HIELYA_OTP_PEPPER;
    if (!filename || !existsSync(filename) || !pepperValue) {
      throw new CustomerAuthenticationError('AUTH_CONFIGURATION_UNAVAILABLE');
    }
    try {
      accessSync(filename, fsConstants.R_OK | fsConstants.W_OK);
      this.persistence ??= new MvpPersistenceDatabase(filename);
      this.persistence.customerAuthenticationPolicy();
    } catch {
      this.persistence?.close();
      this.persistence = undefined;
      throw new CustomerAuthenticationError('AUTH_CONFIGURATION_UNAVAILABLE');
    }
    return {
      repository: new SqliteCustomerAuthenticationRepository(this.persistence),
      pepper: Buffer.from(pepperValue, 'utf8'),
    };
  }

  request(phone: string, now: Date | string) {
    if (!this.requestUseCase) {
      const { repository, pepper } = this.configuration();
      this.requestUseCase = new RequestCustomerOtp(
        repository,
        new RuntimeSimulatedSmsGateway(),
        { getPepper: () => pepper },
      );
    }
    return this.requestUseCase.execute(phone, now);
  }

  verify(input: { challengeId: string; otp: string; now: Date | string }) {
    if (!this.verifyUseCase) {
      const { repository, pepper } = this.configuration();
      this.verifyUseCase = new VerifyCustomerOtp(
        repository,
        { getPepper: () => pepper },
      );
    }
    return this.verifyUseCase.execute(input);
  }
}

export const createRuntimeAuthHandlers = () => {
  const composition = new RuntimeAuthComposition();
  return createAuthHttpHandlers({
    requestOtp: { execute: (phone, now) => composition.request(phone, now ?? new Date()) },
    verifyOtp: {
      execute: (input) => composition.verify({
        challengeId: input.challengeId,
        otp: input.otp,
        now: input.now ?? new Date(),
      }),
    },
    correlationIds: new CryptoCorrelationIdPort(),
    clock: { now: () => new Date() },
  });
};

export const runtimeAuthHandlers = createRuntimeAuthHandlers();
