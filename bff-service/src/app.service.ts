import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface ServiceResponse {
  headers: AxiosResponse['headers'];
  data: AxiosResponse['data'];
  status: AxiosResponse['status'];
}

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getResponse(
    service: string,
    request: Request,
  ): Promise<ServiceResponse> {
    const { method, headers, body, originalUrl } = request;
    const serviceUrl = process.env[service];

    if (!serviceUrl) {
      throw new BadGatewayException('Cannot process request');
    }

    const isCachePath = method === 'GET' && originalUrl === '/products';

    if (isCachePath) {
      const cache = (await this.cacheManager.get(
        originalUrl,
      )) as ServiceResponse;

      if (cache) {
        return cache;
      }
    }

    try {
      const serviceRequest: AxiosRequestConfig = {
        method,
        url: `${serviceUrl}${originalUrl}`,
      };
      const authorizationHeader = headers['authorization'];

      if (authorizationHeader) {
        serviceRequest.headers = {};
        serviceRequest.headers['authorization'] = authorizationHeader;
      }

      if (Object.keys(body).length) {
        serviceRequest.data = body;
      }

      const response = await axios.request(serviceRequest);

      const result = {
        headers: response.headers,
        data: response.data,
        status: response.status,
      };

      if (isCachePath) {
        await this.cacheManager.set(originalUrl, result);
      }

      return result;
    } catch (e) {
      if (e.response) {
        const result = {
          headers: e.response.headers,
          data: e.response.data,
          status: e.response.status,
        };

        return result;
      }

      throw new InternalServerErrorException(e.message);
    }
  }
}
