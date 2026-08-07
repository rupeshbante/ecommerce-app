import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProductQuestion } from '../models/product-qa.models';

@Injectable({ providedIn: 'root' })
export class ProductQAService {
  private readonly API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getForProduct(productId: number) {
    return this.http.get<ProductQuestion[]>(`${this.API}/products/${productId}/questions`);
  }

  ask(productId: number, question: string) {
    return this.http.post<ProductQuestion>(`${this.API}/products/${productId}/questions`, { productId, question });
  }

  answer(questionId: number, answer: string) {
    return this.http.post<ProductQuestion>(`${this.API}/questions/${questionId}/answers`, { answer });
  }

  deleteQuestion(questionId: number) {
    return this.http.delete(`${this.API}/questions/${questionId}`);
  }
}
