import { ObjectId } from 'mongodb';
import type { Request } from 'express';
import type { JWTPayload } from 'jose';

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type PublishStatus = "published" | "unpublished";
export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type UserRole = "customer" | "vendor" | "admin";

export interface Venue {
    _id?: ObjectId;
    name: string;
    location: string;
    category: string;
    pricePerEvent: number;
    capacity: number;
    description: string;
    image: string;
    vendorEmail: string;
    approvalStatus: ApprovalStatus;
    publishStatus: PublishStatus;
    avgRating: number;
    reviewCount: number;
    bookingCount?: number;
    createdAt: Date;
}

export interface Booking {
    _id?: ObjectId;
    venueId: string;
    venueName: string;
    customerEmail: string;
    bookingDate: string;
    guestCount: number;
    totalPrice: number;
    transactionId: string;
    paymentStatus: string;
    status: BookingStatus;
    createdAt: Date;
}

export interface Review {
    _id?: ObjectId;
    venueId: string;
    venueName: string;
    userEmail: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

export interface Payment {
    _id?: ObjectId;
    userEmail: string;
    amount: number;
    transactionId: string;
    paymentStatus: string;
    paymentType: string;
    venueId: string;
    venueName: string;
    paidAt: Date;
}

export interface AppUser {
    _id?: ObjectId;
    name: string;
    email: string;
    role: UserRole;
    isBlocked: boolean;
    profileImage?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: JWTPayload & { email?: string };
}