import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Review, CreateReview, RatingSummary } from '../models/review.models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly API = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getProductReviews(productId: number) {
    return this.http.get<Review[]>(`${this.API}/product/${productId}`);
  }

  getRatingSummary(productId: number) {
    return this.http.get<RatingSummary>(`${this.API}/product/${productId}/summary`);
  }

  getMyReview(productId: number) {
    return this.http.get<Review>(`${this.API}/product/${productId}/my-review`);
  }

  createReview(data: CreateReview) {
    return this.http.post<Review>(this.API, data);
  }

  updateReview(id: number, data: Partial<CreateReview>) {
    return this.http.put<Review>(`${this.API}/${id}`, data);
  }

  deleteReview(id: number) {
    return this.http.delete(`${this.API}/${id}`);
  }
}
