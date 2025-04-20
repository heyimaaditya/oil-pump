import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = ( req: HttpRequest<unknown>, next: HttpHandlerFn ): Observable<HttpEvent<unknown>> => {

  if (environment.apiKey && req.url.startsWith(environment.apiUrl)) {
    const clonedReq = req.clone({
      headers: req.headers.set('X-API-Key', environment.apiKey)
    });
    
    return next(clonedReq);
  } else {
    return next(req); 
  }
};