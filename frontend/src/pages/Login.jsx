import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useLogin } from '../api/auth';
import { motion } from 'framer-motion';
import { slideUp, scaleIn } from '../utils/animations';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const login = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login.mutateAsync({ email, password });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-facebook-primary/5 p-4"
      {...slideUp}
    >
      <div className="w-full max-w-md">
        <motion.div 
          className="text-center mb-8 relative px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Glow effect background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-facebook-primary/30 via-purple-600/30 to-pink-600/30 blur-3xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Main logo - Responsive sizing */}
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-facebook-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 relative z-10"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            {['F', 'a', 'm', 'i', 'l', 'i', 'a'].map((letter, index) => (
              <motion.span
                key={index}
                className="inline-block"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                }}
                whileHover={{
                  scale: 1.2,
                  color: '#ff00ff',
                  transition: { duration: 0.2 }
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.h1>
          
          {/* Floating effect - Responsive text size */}
          <motion.p 
            className="text-base sm:text-lg text-gray-700 relative z-10"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Connect with friends and family around you.
          </motion.p>
        </motion.div>

        <motion.div {...scaleIn}>
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Login to your Familia account</CardDescription>
            </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-facebook-primary font-medium hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
