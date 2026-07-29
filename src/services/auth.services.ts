import { IUser } from "../types/user";
import { UserRepository } from "../repositories/auth.repository";
import { JWT } from "../utils/jwt.util";
import { generateReferral } from "../utils/referral.util";

// Define a standard return type for the service
export type ServiceResponse = {
  status: number;
  newUser?: IUser;
  message?: string;
  token?: string;
};

export class AuthService {
  static async registerUser(
    user: Omit<IUser, "score">,
  ): Promise<ServiceResponse> {
    const existingUser = await UserRepository.find(
      user.walletAddress,
      user.email,
      user.xUsername,
    );

    if (existingUser) {
      if (existingUser.walletAddress === user.walletAddress) {
        return {
          status: 409,
          message: "Conflict: Wallet credential already exists.",
        };
      }
      if (existingUser.xUsername === user.xUsername) {
        return {
          status: 409,
          message: "Conflict: X/Twitter credential already exists.",
        };
      }
      if (existingUser.email === user.email) {
        return {
          status: 409,
          message: "Conflict: Email credential already exists.",
        };
      }
    }

    if (user.referral) {
      const validReferral = await UserRepository.findReferral(user.referral);
      if (!validReferral) {
        return { status: 404, message: "Not Found: Invalid Referral Code." };
      }
    }

    let newUser: IUser | null = null;
    let lastError: unknown;

    for (let attempt = 0; attempt < 5; attempt++) {
      const referral = generateReferral();
      try {
        newUser = await UserRepository.register({ ...user, referral });
        break;
      } catch (err) {
        lastError = err;
        const message = String(err);
        if (!message.includes("duplicate") && !message.includes("unique")) {
          throw err;
        }
      }
    }

    if (!newUser) {
      throw new Error(
        `User registration failed after referral retries: ${String(lastError)}`,
      );
    }

    const token = JWT.sign({
      email: newUser.email,
      walletAddress: newUser.walletAddress,
      xUsername: newUser.xUsername,
    });

    return { status: 201, newUser, token, message: "Success: User on the list." };
  }

  static async loginUser(
    user: Omit<IUser, "email" | "xUsername" | "score">,
  ): Promise<{ token: string , user: IUser} | null> {
    const existingUser = await UserRepository.findOne(user.walletAddress);
    if (!existingUser) return null;
    
    const token = JWT.sign({
      email: existingUser.email,
      walletAddress: existingUser.walletAddress,
      xUsername: existingUser.xUsername,
    })

    return { token:token , user: existingUser};
  }

  static async fetchUser(token: string): Promise<IUser | null> {
    try {
      const { walletAddress } = JWT.verify(token);
      const user: IUser | null = await UserRepository.findOne(walletAddress);
      return user;
    } catch (err) {
      return null;
    }
  }
}
